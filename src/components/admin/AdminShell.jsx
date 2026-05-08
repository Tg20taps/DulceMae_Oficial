import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getStoredAdminSession } from '../../lib/adminApi';
import { isAllowedAdminEmail, isSupabaseConfigured } from '../../lib/supabaseConfig';
import { AccessDenied, AdminFrame, AdminUnavailable, LoginPanel } from './AdminAuth';
import AdminDashboard from './AdminDashboard';

export default function AdminShell() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBooting(false);
      return undefined;
    }

    let mounted = true;

    getStoredAdminSession().then(({ session: storedSession }) => {
      if (!mounted) return;
      setSession(storedSession ?? null);
      setBooting(false);
    }).catch(() => {
      if (!mounted) return;
      setSession(null);
      setBooting(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!isSupabaseConfigured) return <AdminUnavailable />;

  if (booting) {
    return (
      <AdminFrame>
        <div className="flex flex-1 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-[#be185d]" />
        </div>
      </AdminFrame>
    );
  }

  if (!session) return <LoginPanel onLogin={setSession} />;

  if (!isAllowedAdminEmail(session.user.email)) {
    return <AccessDenied session={session} onSignOut={() => setSession(null)} />;
  }

  return <AdminDashboard session={session} onSignOut={() => setSession(null)} />;
}
