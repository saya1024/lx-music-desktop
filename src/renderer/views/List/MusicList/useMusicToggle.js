// import { updateListMusicsPosition } from '@renderer/store/list/action'
import { ref, nextTick } from '@common/utils/vueTools'
import { removeListMusics, getMusicExistListIds, getListMusics } from '@renderer/store/list/listManage'
import { playListById } from '@renderer/core/player'
import { addListMusics, updateListMusicsPosition } from '@renderer/store/list/action'
import { playMusicInfo } from '@renderer/store/player/state'
import { dialog } from '@renderer/plugins/Dialog'
import { useI18n } from '@renderer/plugins/i18n'

export default (props, list) => {
  const isShowMusicToggleModal = ref(false)
  const musicInfo = ref(null)
  const t = useI18n()

  const handleShowMusicToggleModal = (index) => {
    musicInfo.value = list.value[index]
    nextTick(() => {
      isShowMusicToggleModal.value = true
    })
  }

  const toggleSource = async(toggleMusicInfo) => {
    const oldId = musicInfo.value.id
    let oldIdx = list.value.findIndex(m => m.id == oldId)
    if (oldIdx < 0) {
      isShowMusicToggleModal.value = false
      await addListMusics(props.listId, [toggleMusicInfo])
      return
    }
    const id = toggleMusicInfo.id
    const index = list.value.findIndex(m => m.id == id)
    const removeIds = [oldId]
    if (index > -1) {
      if (!await dialog.confirm({
        message: t('music_toggle_duplicate_tip'),
        cancelButtonText: t('cancel_button_text'),
        confirmButtonText: t('confirm_button_text'),
      })) return
      removeIds.push(id)
    }
    isShowMusicToggleModal.value = false

    const otherListIds = (await getMusicExistListIds(oldId)).filter(listId => listId !== props.listId)

    await removeListMusics({ listId: props.listId, ids: removeIds })
    await addListMusics(props.listId, [toggleMusicInfo], 'bottom')
    if (index != -1 && index < oldIdx) oldIdx--
    await updateListMusicsPosition({ listId: props.listId, ids: [id], position: oldIdx })

    if (otherListIds.length) {
      await Promise.all(otherListIds.map(async(listId) => {
        const otherList = await getListMusics(listId)
        let otherOldIdx = otherList.findIndex(m => m.id == oldId)
        if (otherOldIdx < 0) return
        const otherExistIdx = otherList.findIndex(m => m.id == id)
        const otherRemoveIds = [oldId]
        if (otherExistIdx > -1) otherRemoveIds.push(id)
        await removeListMusics({ listId, ids: otherRemoveIds })
        await addListMusics(listId, [toggleMusicInfo], 'bottom')
        let targetPos = otherOldIdx
        if (otherExistIdx > -1 && otherExistIdx < otherOldIdx) targetPos--
        await updateListMusicsPosition({ listId, ids: [id], position: targetPos })
      }))
    }

    if (playMusicInfo.listId == props.listId && playMusicInfo.musicInfo?.id == oldId) {
      playListById(props.listId, toggleMusicInfo.id)
    }
  }

  return {
    isShowMusicToggleModal,
    selectedToggleMusicInfo: musicInfo,
    handleShowMusicToggleModal,
    toggleSource,
  }
}
