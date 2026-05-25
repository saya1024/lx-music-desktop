import { computed } from '@common/utils/vueTools'
import { musicInfo } from '@renderer/store/player/state'
import { findMatchInIndex } from './aiLocalMusicScanner'
import { appSetting } from '@renderer/store/setting'

export const currentLocalFilePath = computed(() => {
  if (!appSetting['common.localMusicPath'] || !musicInfo.name) return null
  return findMatchInIndex(musicInfo.name, musicInfo.singer)
})
