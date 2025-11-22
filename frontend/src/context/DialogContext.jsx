import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({ open: false })

  const closeDialog = useCallback((result) => {
    setDialogState((prev) => {
      if (prev.resolve) {
        prev.resolve(result)
      }
      return { open: false }
    })
  }, [])

  const alertDialog = useCallback(({ title = 'Aviso', message, confirmText = 'Aceptar' }) => {
    if (!message) return Promise.resolve()
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type: 'alert',
        title,
        message,
        confirmText,
        resolve,
      })
    })
  }, [])

  const confirmDialog = useCallback(({
    title = 'Confirmar',
    message,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
  }) => {
    if (!message) return Promise.resolve(false)
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        resolve,
      })
    })
  }, [])

  const dialogValue = useMemo(() => ({ alertDialog, confirmDialog }), [alertDialog, confirmDialog])

  const handleConfirm = () => closeDialog(true)
  const handleCancel = () => closeDialog(false)

  return (
    <DialogContext.Provider value={dialogValue}>
      {children}
      {dialogState.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{dialogState.title}</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{dialogState.message}</p>
            <div className={`flex ${dialogState.type === 'confirm' ? 'justify-end gap-2' : 'justify-center'}`}>
              {dialogState.type === 'confirm' && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleCancel}
                >
                  {dialogState.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirm}
              >
                {dialogState.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
