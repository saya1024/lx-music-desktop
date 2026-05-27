import { formatMusicName } from './tools'

const AUDIO_EXTS = ['.mp3', '.flac', '.wav', '.ape', '.ogg', '.m4a', '.wma']

const INVALID_CHAR_MAP: Record<string, string> = {
  '<': '＜',
  '>': '＞',
  ':': '：',
  '"': '″',
  '/': '／',
  '\\': '＼',
  '|': '｜',
  '?': '？',
  '*': '＊',
}

const invalidCharRxp = new RegExp(`[${Object.keys(INVALID_CHAR_MAP).join('')}]`, 'g')

export const getAudioExts = () => [...AUDIO_EXTS]

/**
 * 替换文件名中的非法字符为相似 Unicode 字符
 */
export const replaceInvalidFileNameChars = (name: string): string => {
  return name.replace(invalidCharRxp, match => INVALID_CHAR_MAP[match])
}

/**
 * 统一的歌曲名→文件名转换（不含扩展名）
 * 与下载系统使用的文件名规则完全一致
 * @param name 歌曲名
 * @param singer 歌手
 * @param format 命名格式，如 '歌名 - 歌手'
 */
export const musicNameToFileName = (name: string, singer: string, format: string): string => {
  return replaceInvalidFileNameChars(formatMusicName(format, name, singer))
}

const FORMATS = [
  '歌名 - 歌手',
  '歌手 - 歌名',
  '歌名',
] as const

/**
 * 清理格式化后多余的尾部连接符，如 "歌名 - " → "歌名"
 */
const trimTrailingSeparator = (name: string): string => {
  return name.replace(/\s*[-–—]\s*$/, '').trim()
}

/**
 * 根据歌曲信息生成所有可能的规范化文件名（不含扩展名）
 * 优先匹配 歌名-歌手，再匹配 歌手-歌名，最后仅匹配歌名
 * @param name 歌曲名
 * @param singer 歌手
 */
export const getAllPossibleNames = (name: string, singer: string): string[] => {
  const names: string[] = []
  for (const format of FORMATS) {
    const candidate = musicNameToFileName(name, singer, format)
    const trimmed = trimTrailingSeparator(candidate)
    if (trimmed && !names.includes(trimmed)) names.push(trimmed)
    if (trimmed !== candidate && !names.includes(candidate)) names.push(candidate)
  }
  return names
}

/**
 * 根据歌曲信息生成可能的文件名列表（含不同扩展名）
 * @param name 歌曲名
 * @param singer 歌手
 * @param format 命名格式
 */
export const getPossibleFileNames = (name: string, singer: string, format: string): string[] => {
  const baseName = musicNameToFileName(name, singer, format)
  return AUDIO_EXTS.map(ext => `${baseName}${ext}`)
}
