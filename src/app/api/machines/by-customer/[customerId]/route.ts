import { NextResponse } from 'next/server';
import { getMachineRecordsByCustomer } from '@/lib/kintone/machine';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  try {
    const records = await getMachineRecordsByCustomer(customerId);
    const machines = records
      .map((record) => ({
        id: record.$id.value,
        name: record.McItem?.value ?? '',
        vendor: record.Vender?.value ?? '',
        model: record.Moldel?.value ?? '',
        serialNo: record.SrialNo?.value ?? '',
        machineNo: record.MCNo?.value ?? '',
      }))
      .filter((machine) => machine.name || machine.model || machine.serialNo || machine.machineNo);

    return NextResponse.json(machines);
  } catch (error) {
    console.error('Failed to fetch machine records:', error);
    return NextResponse.json({ error: 'Failed to fetch machine data' }, { status: 500 });
  }
}
