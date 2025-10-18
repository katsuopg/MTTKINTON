import { NextRequest, NextResponse } from 'next/server';
import { createActionClient } from '@/lib/supabase/server';
import { Tables, TablesInsert } from '@/types/supabase';

type Section = Tables<'project_part_sections'>;
type ElectricalPart = Tables<'project_electrical_parts'>;
type MechanicalPart = Tables<'project_mechanical_parts'>;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createActionClient();
    
    // セクション情報を取得
    const { data: sections, error: sectionsError } = await supabase
      .from('project_part_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('section_order');

    if (sectionsError) {
      return NextResponse.json({ error: sectionsError.message }, { status: 500 });
    }

    // セクションごとの部品を取得
    const sectionsWithParts = await Promise.all((sections || []).map(async (section) => {
      if (section.section_type === 'electrical') {
        const { data: parts, error } = await supabase
          .from('project_electrical_parts')
          .select('*')
          .eq('section_id', section.id)
          .order('item_no');
        
        if (error) {
          console.error('Error fetching electrical parts:', error);
        }
        
        return { ...section, parts: parts || [] };
      } else {
        const { data: parts, error } = await supabase
          .from('project_mechanical_parts')
          .select('*')
          .eq('section_id', section.id)
          .order('no');
        
        if (error) {
          console.error('Error fetching mechanical parts:', error);
        }
        
        return { ...section, parts: parts || [] };
      }
    }));

    return NextResponse.json({ sections: sectionsWithParts });
  } catch (error) {
    console.error('Error fetching project parts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createActionClient();
    const body = await request.json();
    const { sections, type } = body;

    // トランザクション的な処理（まず既存データを削除してから新規作成）
    // 既存のセクションを削除（関連する部品も自動で削除される）
    const { error: deleteError } = await supabase
      .from('project_part_sections')
      .delete()
      .eq('project_id', projectId)
      .eq('section_type', type);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // セクションごとに処理
    const results = await Promise.all(sections.map(async (section: any, index: number) => {
      // セクションを作成
      const sectionData: TablesInsert<'project_part_sections'> = {
        project_id: projectId,
        section_type: type,
        section_name: section.name,
        section_order: index
      };

      const { data: newSection, error: sectionError } = await supabase
        .from('project_part_sections')
        .insert(sectionData)
        .select()
        .single();

      if (sectionError || !newSection) {
        console.error('Error creating section:', sectionError);
        return null;
      }

      // 部品を作成
      if (section.parts && section.parts.length > 0) {
        if (type === 'electrical') {
          const partsData: TablesInsert<'project_electrical_parts'>[] = section.parts.map((part: any) => ({
            section_id: newSection.id,
            item_no: part.item,
            mark: part.mark || '-',
            name: part.name || '',
            model: part.model || '',
            brand: part.vender || '',
            qty: part.qty || 0,
            unit_price: part.unitPrice || 0,
            lead_time: part.leadTime || '',
            supplier: part.supplier || '',
            note: part.note || ''
          }));

          const { error: partsError } = await supabase
            .from('project_electrical_parts')
            .insert(partsData);

          if (partsError) {
            console.error('Error creating electrical parts:', partsError);
          }
        } else {
          const partsData: TablesInsert<'project_mechanical_parts'>[] = section.parts.map((part: any) => ({
            section_id: newSection.id,
            no: part.no,
            dwg_no: part.dwgNo || '',
            name: part.name || '',
            qty: part.qty || 0,
            material: part.material || '',
            heat_treatment: part.heatTreatment || '',
            surface_treatment: part.surfaceTreatment || '',
            note: part.note || '',
            order_type: part.order || 'Production',
            lead_time: part.leadTime || '',
            unit_price: part.unitPrice || 0
          }));

          const { error: partsError } = await supabase
            .from('project_mechanical_parts')
            .insert(partsData);

          if (partsError) {
            console.error('Error creating mechanical parts:', partsError);
          }
        }
      }

      return newSection;
    }));

    return NextResponse.json({ success: true, sections: results.filter(Boolean) });
  } catch (error) {
    console.error('Error saving project parts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}