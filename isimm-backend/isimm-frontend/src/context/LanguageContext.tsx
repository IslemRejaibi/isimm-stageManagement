import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type LanguageCode = 'fr' | 'en';

type TranslationKeys =
  | 'sidebar.dashboard'
  | 'sidebar.stages'
  | 'sidebar.pfe'
  | 'sidebar.documents'
  | 'sidebar.notifications'
  | 'sidebar.profile'
  | 'sidebar.settings'
  | 'sidebar.logout'
  | 'sidebar.studentSpace'
  | 'profile.title'
  | 'profile.subtitle'
  | 'profile.edit'
  | 'profile.cancel'
  | 'profile.save'
  | 'profile.personalInfo'
  | 'profile.academicInfo'
  | 'profile.security'
  | 'profile.email'
  | 'profile.phone'
  | 'profile.name'
  | 'profile.firstName'
  | 'profile.studentNumber'
  | 'profile.specialty'
  | 'profile.level'
  | 'profile.department'
  | 'profile.notEntered'
  | 'profile.noSpecialty'
  | 'profile.noStudent'
  | 'profile.noLevel'
  | 'profile.noDepartment'
  | 'profile.manageAccount'
  | 'params.title'
  | 'params.subtitle'
  | 'params.appearance'
  | 'params.language'
  | 'params.notifications'
  | 'params.emailNotifications'
  | 'params.pushNotifications'
  | 'params.stageUpdates'
  | 'params.pfeUpdates'
  | 'params.docsStatus'
  | 'params.light'
  | 'params.dark'
  | 'params.french'
  | 'params.english'
  | 'params.save'
  | 'stages.title'
  | 'stages.subtitle'
  | 'stages.newRequest'
  | 'stages.total'
  | 'stages.validated'
  | 'stages.pending'
  | 'stages.ongoing'
  | 'stages.searchPlaceholder'
  | 'stages.allStatuses'
  | 'stages.allTypes'
  | 'stages.stageTitle'
  | 'stages.type'
  | 'stages.report'
  | 'stages.reportUpload'
  | 'stages.reportReplace'
  | 'stages.attestation'
  | 'stages.attestationUpload'
  | 'stages.attestationReplace'
  | 'stages.start'
  | 'stages.end'
  | 'stages.tutor'
  | 'stages.noTutor'
  | 'stages.noResults';

const translations: Record<LanguageCode, Record<TranslationKeys, string>> = {
  fr: {
    'sidebar.dashboard': 'Dashboard',
    'sidebar.stages': 'Mes stages',
    'sidebar.pfe': 'Mon PFE',
    'sidebar.documents': 'Documents',
    'sidebar.notifications': 'Notifications',
    'sidebar.profile': 'Mon profil',
    'sidebar.settings': 'Paramètres',
    'sidebar.logout': 'Déconnexion',
    'sidebar.studentSpace': 'Espace étudiant',
    'profile.title': 'Mon profil',
    'profile.subtitle': 'Consultez et gérez vos informations personnelles',
    'profile.edit': 'Modifier',
    'profile.cancel': 'Annuler',
    'profile.save': 'Sauvegarder',
    'profile.personalInfo': 'Informations personnelles',
    'profile.academicInfo': 'Informations académiques',
    'profile.security': 'Sécurité',
    'profile.email': 'Email',
    'profile.phone': 'Téléphone',
    'profile.name': 'Nom',
    'profile.firstName': 'Prénom',
    'profile.studentNumber': 'Numéro étudiant',
    'profile.specialty': 'Spécialité',
    'profile.level': 'Niveau',
    'profile.department': 'Département',
    'profile.notEntered': 'Non renseigné',
    'profile.noSpecialty': 'Aucune spécialité renseignée',
    'profile.noStudent': 'Étudiant',
    'profile.noLevel': 'Non renseigné',
    'profile.noDepartment': 'Non renseigné',
    'profile.manageAccount': 'Gérez les informations de connexion et les paramètres de votre compte.',
    'params.title': 'Paramètres',
    'params.subtitle': 'Gérez vos préférences et la confidentialité de votre compte.',
    'params.appearance': 'Apparence',
    'params.language': 'Langue',
    'params.notifications': 'Notifications',
    'params.emailNotifications': 'Notifications par email',
    'params.pushNotifications': 'Notifications push',
    'params.stageUpdates': 'Mises à jour des stages',
    'params.pfeUpdates': 'Mises à jour du PFE',
    'params.docsStatus': 'Statut des documents',
    'params.light': 'Clair',
    'params.dark': 'Sombre',
    'params.french': 'Français',
    'params.english': 'Anglais',
    'params.save': 'Enregistrer',
    'stages.title': 'Mes stages',
    'stages.subtitle': 'Consultez et gérez vos demandes de stage.',
    'stages.newRequest': 'Nouvelle demande',
    'stages.total': 'Total des stages',
    'stages.validated': 'Validés',
    'stages.pending': 'En attente',
    'stages.ongoing': 'En cours',
    'stages.searchPlaceholder': 'Rechercher une entreprise, un titre ou un type...',
    'stages.allStatuses': 'Tous les statuts',
    'stages.allTypes': 'Tous les types',
    'stages.stageTitle': 'Titre du stage',
    'stages.type': 'Type',
    'stages.report': 'Rapport de stage',
    'stages.reportUpload': 'Ajouter le rapport',
    'stages.reportReplace': 'Remplacer le rapport',
    'stages.attestation': 'Attestation',
    'stages.attestationUpload': 'Ajouter l’attestation',
    'stages.attestationReplace': 'Remplacer l’attestation',
    'stages.start': 'Début',
    'stages.end': 'Fin',
    'stages.tutor': 'Tuteur',
    'stages.noTutor': 'Non renseigné',
    'stages.noResults': 'Aucun stage ne correspond à vos filtres.',
  },
  en: {
    'sidebar.dashboard': 'Dashboard',
    'sidebar.stages': 'My Internships',
    'sidebar.pfe': 'My PFE',
    'sidebar.documents': 'Documents',
    'sidebar.notifications': 'Notifications',
    'sidebar.profile': 'My Profile',
    'sidebar.settings': 'Settings',
    'sidebar.logout': 'Logout',
    'sidebar.studentSpace': 'Student Area',
    'profile.title': 'My Profile',
    'profile.subtitle': 'View and manage your personal information',
    'profile.edit': 'Edit',
    'profile.cancel': 'Cancel',
    'profile.save': 'Save',
    'profile.personalInfo': 'Personal Information',
    'profile.academicInfo': 'Academic Information',
    'profile.security': 'Security',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.name': 'Last Name',
    'profile.firstName': 'First Name',
    'profile.studentNumber': 'Student Number',
    'profile.specialty': 'Specialty',
    'profile.level': 'Level',
    'profile.department': 'Department',
    'profile.notEntered': 'Not entered',
    'profile.noSpecialty': 'No specialty entered',
    'profile.noStudent': 'Student',
    'profile.noLevel': 'Not entered',
    'profile.noDepartment': 'Not entered',
    'profile.manageAccount': 'Manage your login information and account settings.',
    'params.title': 'Settings',
    'params.subtitle': 'Manage your preferences and privacy settings.',
    'params.appearance': 'Appearance',
    'params.language': 'Language',
    'params.notifications': 'Notifications',
    'params.emailNotifications': 'Email notifications',
    'params.pushNotifications': 'Push notifications',
    'params.stageUpdates': 'Stage updates',
    'params.pfeUpdates': 'PFE updates',
    'params.docsStatus': 'Document status',
    'params.light': 'Light',
    'params.dark': 'Dark',
    'params.french': 'French',
    'params.english': 'English',
    'params.save': 'Save',
    'stages.title': 'My Internships',
    'stages.subtitle': 'View and manage your internship requests.',
    'stages.newRequest': 'New request',
    'stages.total': 'Total internships',
    'stages.validated': 'Validated',
    'stages.pending': 'Pending',
    'stages.ongoing': 'Ongoing',
    'stages.searchPlaceholder': 'Search by company, title or type...',
    'stages.allStatuses': 'All statuses',
    'stages.allTypes': 'All types',
    'stages.stageTitle': 'Internship title',
    'stages.type': 'Type',
    'stages.report': 'Internship report',
    'stages.reportUpload': 'Upload report',
    'stages.reportReplace': 'Replace report',
    'stages.attestation': 'Certificate',
    'stages.attestationUpload': 'Upload certificate',
    'stages.attestationReplace': 'Replace certificate',
    'stages.start': 'Start',
    'stages.end': 'End',
    'stages.tutor': 'Tutor',
    'stages.noTutor': 'Not entered',
    'stages.noResults': 'No internships match your filters.',
  },
};

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (value: LanguageCode) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('app-lang');
    return saved === 'en' ? 'en' : 'fr';
  });

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  const contextValue = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: TranslationKeys) => translations[lang][key],
    }),
    [lang],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
