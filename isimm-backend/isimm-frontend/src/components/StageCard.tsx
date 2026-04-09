interface StageCardProps {
  stage: {
    _id: string;
    titre: string;
    description?: string;
    entreprise: {
      nom: string;
    };
    dateDebut: string;
    dateFin: string;
    statut: string;
  };
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  terminé: 'Terminé',
  validé: 'Validé',
  refusé: 'Refusé',
};

const StageCard = ({ stage }: StageCardProps) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm transition hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">{stage.titre}</h3>
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">
            {stage.description || 'Pas de description fournie.'}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {STATUT_LABELS[stage.statut] || stage.statut}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Entreprise</p>
          <p className="font-medium text-slate-900">{stage.entreprise?.nom || '-'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Début</p>
            <p>{new Date(stage.dateDebut).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Fin</p>
            <p>{new Date(stage.dateFin).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageCard;
