import { useEffect, useRef, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleLoginButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;
    function tryInit() {
      if (cancelled) return;
      if (!window.google || !containerRef.current) {
        setTimeout(tryInit, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID as string,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        shape: "pill",
        locale: "ko",
      });
      setReady(true);
    }
    tryInit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) {
    return <p className="muted">구글 로그인이 아직 설정되지 않았습니다. 관리자에게 문의하세요.</p>;
  }

  return (
    <div>
      <div ref={containerRef} />
      {!ready && <p className="muted">불러오는 중...</p>}
    </div>
  );
}
