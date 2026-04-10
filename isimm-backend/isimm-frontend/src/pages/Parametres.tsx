import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

const Parametres = () => {
  const { lang, setLang, t } = useLanguage();
  const [theme, setTheme] = useState<'clair' | 'sombre'>('clair');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifStages, setNotifStages] = useState(true);
  const [notifPFE, setNotifPFE] = useState(true);
  const [notifDocs, setNotifDocs] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as 'clair' | 'sombre' | null;
    const savedNotifEmail = localStorage.getItem('notif-email');
    const savedNotifPush = localStorage.getItem('notif-push');
    const savedNotifStages = localStorage.getItem('notif-stages');
    const savedNotifPFE = localStorage.getItem('notif-pfe');
    const savedNotifDocs = localStorage.getItem('notif-docs');

    if (savedTheme) setTheme(savedTheme);
    if (savedNotifEmail !== null) setNotifEmail(savedNotifEmail === 'true');
    if (savedNotifPush !== null) setNotifPush(savedNotifPush === 'true');
    if (savedNotifStages !== null) setNotifStages(savedNotifStages === 'true');
    if (savedNotifPFE !== null) setNotifPFE(savedNotifPFE === 'true');
    if (savedNotifDocs !== null) setNotifDocs(savedNotifDocs === 'true');
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
      localStorage.setItem('app-lang', lang);
      localStorage.setItem('notif-email', notifEmail.toString());
      localStorage.setItem('notif-push', notifPush.toString());
      localStorage.setItem('notif-stages', notifStages.toString());
      localStorage.setItem('notif-pfe', notifPFE.toString());
      localStorage.setItem('notif-docs', notifDocs.toString());
    } catch (err) {
      console.error('Error saving settings', err);
    }
  };

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 page-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{t('params.title')}</h1>
              <p className="mt-2 text-slate-500">{t('params.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
            >
              {t('params.save')}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="app-card p-8">
            <h2 className="text-xl font-semibold text-heading">{t('params.appearance')}</h2>
            <p className="mt-2 text-slate-500">{t('params.language')}</p>
            <div className="mt-6 grid gap-4">
              <div className="space-y-3">
                {['clair', 'sombre'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option as 'clair' | 'sombre')}
                    className={`w-full rounded-3xl border px-5 py-4 text-left text-sm font-medium transition ${
                      theme === option
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {option === 'clair' ? t('params.light') : t('params.dark')}
                  </button>
                ))}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <label className="block text-sm font-medium text-slate-500">{t('params.language')}</label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
                  className="input-field"
                >
                  <option value="fr">{t('params.french')}</option>
                  <option value="en">{t('params.english')}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="app-card p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{t('params.notifications')}</h2>
                <p className="mt-2 text-slate-500">{t('params.notifications')}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                { label: t('params.emailNotifications'), value: notifEmail, setter: setNotifEmail },
                { label: t('params.pushNotifications'), value: notifPush, setter: setNotifPush },
              ].map((item) => (
                <label key={item.label} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="text-sm text-slate-900">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.value}
                    onChange={(e) => item.setter(e.target.checked)}
                  />
                </label>
              ))}

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{t('params.notifications')}</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: t('params.stageUpdates'), value: notifStages, setter: setNotifStages },
                    { label: t('params.pfeUpdates'), value: notifPFE, setter: setNotifPFE },
                    { label: t('params.docsStatus'), value: notifDocs, setter: setNotifDocs },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
                      <span className="text-sm text-slate-900">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={item.value}
                        onChange={(e) => item.setter(e.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
