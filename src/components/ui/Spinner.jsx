export default function Spinner({ className = 'w-10 h-10' }) {
  return (
    <div
      className={`${className} border-[3px] border-primary/20 border-t-primary rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  )
}
