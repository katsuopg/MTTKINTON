'use client';

import { useState } from 'react';
import { Language } from '@/lib/kintone/field-mappings';

interface FileInfo {
  fileKey: string;
  name: string;
  contentType: string;
  size: string;
}

interface FileViewerModalProps {
  files: FileInfo[];
  language: Language;
}

export default function FileViewerModal({ files, language }: FileViewerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const currentFile = files[selectedFileIndex];

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const nextFile = () => {
    setSelectedFileIndex((prev) => (prev + 1) % files.length);
  };

  const prevFile = () => {
    setSelectedFileIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const downloadFile = () => {
    const downloadUrl = `/api/kintone/download?fileKey=${currentFile.fileKey}&fileName=${encodeURIComponent(currentFile.name)}`;
    window.open(downloadUrl, '_blank');
  };

  const isPDF = currentFile?.contentType === 'application/pdf';
  const isImage = currentFile?.contentType?.startsWith('image/');

  return (
    <>
      {/* トリガーボタン */}
      <button
        onClick={openModal}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
        title={files[0].name}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {files.length > 1 && (
          <span className="ml-1 text-xs">+{files.length - 1}</span>
        )}
      </button>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 背景オーバーレイ */}
            <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* ヘッダー */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {currentFile?.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {/* ファイル切り替えボタン（複数ファイルの場合） */}
                    {files.length > 1 && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={prevFile}
                          className="p-1 rounded hover:bg-gray-200"
                          title={language === 'ja' ? '前のファイル' : 'Previous file'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-600">
                          {selectedFileIndex + 1} / {files.length}
                        </span>
                        <button
                          onClick={nextFile}
                          className="p-1 rounded hover:bg-gray-200"
                          title={language === 'ja' ? '次のファイル' : 'Next file'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {/* ダウンロードボタン */}
                    <button
                      onClick={downloadFile}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {language === 'ja' ? 'ダウンロード' : 'Download'}
                    </button>
                    
                    {/* 閉じるボタン */}
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* コンテンツエリア */}
              <div className="bg-gray-100 p-4" style={{ minHeight: '500px', maxHeight: '80vh' }}>
                {isPDF && (
                  <embed
                    src={`/api/kintone/download?fileKey=${currentFile.fileKey}&fileName=${encodeURIComponent(currentFile.name)}&inline=true`}
                    type="application/pdf"
                    className="w-full h-full"
                    style={{ minHeight: '600px' }}
                    title={currentFile.name}
                  />
                )}
                {isImage && (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={`/api/kintone/download?fileKey=${currentFile.fileKey}&fileName=${encodeURIComponent(currentFile.name)}`}
                      alt={currentFile.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                {!isPDF && !isImage && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">{currentFile.name}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {language === 'ja' 
                        ? 'このファイル形式はプレビューできません' 
                        : 'This file type cannot be previewed'}
                    </p>
                    <button
                      onClick={downloadFile}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {language === 'ja' ? 'ファイルをダウンロード' : 'Download File'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}