// Shared ambient background for the main (protected) app screens.
// Mount this once in App.jsx's AppLayout; don't add it to individual pages.
export default function AmbientBackground() {
    return (
      <div
        className="qyven-app-ambient"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <span className="qyven-app-blob blob-a" />
        <span className="qyven-app-blob blob-b" />
        <span className="qyven-app-blob blob-c" />
  
        <style>{`
          .qyven-app-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(40px);
            opacity: 0.55;
          }
          .blob-a {
            width: 480px; height: 480px;
            top: -60px; left: -40px;
            background: radial-gradient(circle, rgba(255,122,198,0.35), transparent 70%);
            animation: qyvenAppDrift0 26s ease-in-out infinite;
          }
          .blob-b {
            width: 460px; height: 460px;
            top: 260px; right: -60px;
            background: radial-gradient(circle, rgba(124,58,237,0.32), transparent 70%);
            animation: qyvenAppDrift1 31s ease-in-out infinite;
          }
          .blob-c {
            width: 420px; height: 420px;
            bottom: -60px; left: 20%;
            background: radial-gradient(circle, rgba(0,205,180,0.28), transparent 70%);
            animation: qyvenAppDrift2 29s ease-in-out infinite;
          }
  
          .dark .qyven-app-blob { opacity: 0.4; }
  
          @keyframes qyvenAppDrift0 {
            0%, 100% { transform: translate(0,0); }
            50% { transform: translate(30px, 24px); }
          }
          @keyframes qyvenAppDrift1 {
            0%, 100% { transform: translate(0,0); }
            50% { transform: translate(-28px, 30px); }
          }
          @keyframes qyvenAppDrift2 {
            0%, 100% { transform: translate(0,0); }
            50% { transform: translate(18px, -26px); }
          }
  
          @media (prefers-reduced-motion: reduce) {
            .qyven-app-blob { animation: none !important; }
          }
  
          @media (max-width: 640px) {
            .qyven-app-blob { opacity: 0.4; }
            .dark .qyven-app-blob { opacity: 0.26; }
          }
        `}</style>
      </div>
    )
  }