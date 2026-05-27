import fs from 'node:fs'
import path from 'node:path'
import { ref } from '@common/utils/vueTools'
import { getAllPossibleNames, getAudioExts } from '../../../common/utils/aiFileName'

export const scanVersion = ref(0)

export interface LocalFileIndex {
  /** 规范化文件名 → 文件路径的映射 */
  fileMap: Map<string, string>
  /** 最后扫描时间 */
  scannedAt: number
  /** 扫描的目录路径 */
  scannedPath: string
  /** 扫描到的文件总数 */
  totalFiles: number
}

let fileIndex: LocalFileIndex | null = null

/**
 * 获取当前文件索引
 */
export const getFileIndex = (): Readonly<LocalFileIndex | null> => fileIndex

/**
 * 递归扫描目录下的所有音频文件
 * @param dirPath 要扫描的目录路径
 */
export const scanLocalMusicDir = async(dirPath: string): Promise<LocalFileIndex> => {
  const fileMap = new Map<string, string>()
  const audioExts = getAudioExts()

  if (!dirPath || !await fs.promises.access(dirPath).then(() => true).catch(() => false)) {
    fileIndex = { fileMap, scannedAt: Date.now(), scannedPath: dirPath, totalFiles: 0 }
    return fileIndex
  }

  let totalFiles = 0
  await scanDir(dirPath, fileMap, audioExts, () => { totalFiles++ })

  fileIndex = { fileMap, scannedAt: Date.now(), scannedPath: dirPath, totalFiles }
  scanVersion.value++
  return fileIndex
}

const scanDir = async(
  dirPath: string,
  fileMap: Map<string, string>,
  audioExts: string[],
  onFileFound: () => void,
): Promise<void> => {
  let entries: string[]
  try {
    entries = await fs.promises.readdir(dirPath)
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry)
    try {
      const stat = await fs.promises.stat(fullPath)
      if (stat.isDirectory()) {
        await scanDir(fullPath, fileMap, audioExts, onFileFound)
      } else if (stat.isFile()) {
        const ext = path.extname(entry).toLowerCase()
        if (!audioExts.includes(ext)) continue
        onFileFound()
        indexFile(fullPath, fileMap)
      }
    } catch {
      // skip files that can't be accessed
    }
  }
}

const addKey = (fileMap: Map<string, string>, key: string, filePath: string) => {
  if (key && !fileMap.has(key)) fileMap.set(key, filePath)
}

const indexFile = (
  filePath: string,
  fileMap: Map<string, string>,
): void => {
  const baseName = path.parse(filePath).name
  addKey(fileMap, baseName, filePath)
}

/**
 * 根据歌曲信息在索引中查找匹配的本地文件
 * 依次尝试 歌名-歌手、歌手-歌名、仅歌名 三种命名方式匹配
 * @param name 歌曲名
 * @param singer 歌手
 * @returns 匹配的文件路径，未找到返回 null
 */
export const findMatchInIndex = (
  name: string,
  singer: string,
): string | null => {
  if (!fileIndex) return null
  const possibleKeys = getAllPossibleNames(name, singer)
  if (name == 'Möbius') console.log(`[mylog] ${name} \n${possibleKeys.join('\n')}`)
  for (const key of possibleKeys) {
    const path = fileIndex.fileMap.get(key)
    if (path) return path
  }
  return null
}

/**
 * 将单个文件加入索引（下载完成后调用）
 */
export const addFileToIndex = (filePath: string): void => {
  if (!fileIndex) return
  indexFile(filePath, fileIndex.fileMap)
  scanVersion.value++
}

/**
 * 清除文件索引
 */
export const clearFileIndex = () => {
  fileIndex = null
}
