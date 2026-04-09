import { useEffect, useState } from 'react';

const Parametres = () => {
  const [theme, setTheme] = useState<'clair' | 'sombre'>('clair');
  const [langue, setLangue] = useState('Français');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifStages, setNotifStages] = useState(true);
  const [notifPFE, setNotifPFE] = useState(true);
  const [notifDocs, setNotifDocs] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'clair' | 'sombre' | null;
    const savedLang = localStorage.getItem('app-lang');
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLangue(savedLang);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('light', 'dark');
    if (theme === 'sombre') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const handleSave = async () => {
    try {
      localStorage.setItem('app-theme', theme);
      localStorage.setItem('app-lang', langue);
      localStorage.setItem('notif-email', notifEmail.toString());
      localStorage.setItem('notif-push', notifPush.toString());
      localStorage.setItem('notif-stages', notifStages.toString());
      localStorage.setItem('notif-pfe', notifPFE.toString());
      localStorage.setItem('notif-docs', notifDocs.toString());
      // TODO: Send to API if needed
    } catch (err) {
      console.error('Error saving settings');
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Paramètres</h1>
          <p className="mt-2 text-slate-500">Gérez vos préférences et la confidentialité de votre compte.</p>
        </div>
        <button onClick={handleSave} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Enregistrer
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Apparence</h2>
          <p className="mt-2 text-slate-500">Personnalisez l'apparence de l'application.</p>
          <div className="mt-6 space-y-3">
            {['clair', 'sombre'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option as 'clair' | 'sombre')}
                className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                  theme === option
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                }`}
              >
                <strong className="block text-sm capitalize">
                  {option === 'clair' ? 'Clair' : 'Sombre'}
                </strong>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <label className="block text-sm font-medium text-slate-500">Langue</label>
            <select
              value={langue}
              onChange={(e) => setLangue(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
            >
              <option>Français</option>
              <option>Anglais</option>
            </select>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
          <p className="mt-2 text-slate-500">Choisissez les notifications que vous souhaitez recevoir.</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Notifications par email', value: notifEmail, setter: setNotifEmail },
              { label: 'Notifications push', value: notifPush, setter: setNotifPush },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <span className="text-sm text-slate-900">{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => {
                    item.setter(e.target.checked);
                    localStorage.setItem(`notif-${item.label.toLowerCase().replace(' ', '-')}`, e.target.checked.toString());
                  }}
                />
              </label>
            ))}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Types de notifications</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Mises à jour des stages', value: notifStages, setter: setNotifStages },
                  { label: 'Mises à jour du PFE', value: notifPFE, setter: setNotifPFE },
                  { label: 'Statut des documents', value: notifDocs, setter: setNotifDocs },
                ].map((item) => (
                  <label key={item.label} className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
                    <span className="text-sm text-slate-900">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.value}
                      onChange={(e) => {
                        item.setter(e.target.checked);
                        localStorage.setItem(`notif-${item.label.toLowerCase().replace(' ', '-')}`, e.target.checked.toString());
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
