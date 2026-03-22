export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="btn-close btn-close-white" onClick={onDismiss} />
      )}
    </div>
  )
}
