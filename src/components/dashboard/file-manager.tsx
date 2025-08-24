"use client";

import { FileCard } from "@/components/dashboard/file-card";

interface File {
    id: string;
    source: string;
    name: string;
    categoryName: string;
    categoryId: string;
}

interface FileManagerProps {
  files: File[];
}

export function FileManager({ files }: FileManagerProps) {
  if (!files.length) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">No hay archivos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}
