import { FileText, Image as ImageIcon, FileArchive, FileIcon as FileGeneric, FileSpreadsheet } from "lucide-react"

interface FileIconProps {
  mimeType: string
  className?: string
}

export function FileIcon({ mimeType, className = "h-8 w-8 text-slate-400" }: FileIconProps) {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className={className} />
  }
  
  if (mimeType.includes("pdf")) {
    return <FileText className={`text-red-500 ${className}`} />
  }
  
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) {
    return <FileSpreadsheet className={`text-green-500 ${className}`} />
  }
  
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar")) {
    return <FileArchive className={`text-amber-500 ${className}`} />
  }
  
  return <FileGeneric className={className} />
}
