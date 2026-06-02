import { addToQueue, getQueue, removeFromQueue, updateStatus } from './offlineQueue'
import httpClient from '../services/base/httpClient'
import { useSyncStore } from '../store/syncStore'

class SyncWorker {
  syncing = false

  async queueOrder(orderData: unknown) {
    const id = await addToQueue('createOrder', orderData)
    useSyncStore.getState().setPendingCount((await getQueue('pending')).length)
    return id
  }

  async queueTableAction(action: unknown) {
    const id = await addToQueue('tableAction', action)
    useSyncStore.getState().setPendingCount((await getQueue('pending')).length)
    return id
  }

  async sync() {
    if (this.syncing) return
    this.syncing = true
    try {
      const queue = await getQueue('pending')
      useSyncStore.getState().setPendingCount(queue.length)
      for (const item of queue) {
        try {
          if (item.operation === 'createOrder') {
            await httpClient.post('/orders', item.data)
          } else if (item.operation === 'tableAction') {
            const { tableId, action, data } = item.data
            await httpClient.put(`/tables/${tableId}/${action}`, data)
          }
          await removeFromQueue(item.id)
        } catch (err: any) {
          if (err?.response?.status && err.response.status < 500) {
            await removeFromQueue(item.id)
          } else if (item.retries >= 5) {
            await updateStatus(item.id, 'failed', item.retries)
            useSyncStore.getState().addFailure({
              id: item.id,
              operation: item.operation,
              error: err?.message || 'Sync failed',
              createdAt: item.createdAt,
            })
          } else {
            const nextRetries = (item.retries || 0) + 1
            await updateStatus(item.id, 'pending', nextRetries)
          }
        }
      }
    } finally {
      this.syncing = false
      useSyncStore.getState().setPendingCount((await getQueue('pending')).length)
    }
  }

  async getFailedItems() {
    return getQueue('failed')
  }
}

const worker = new SyncWorker()
export default worker
