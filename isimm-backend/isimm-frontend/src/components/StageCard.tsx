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

const STATUS_CLASS: Record<string, string> = {
  en_attente: 'status-en_attente',
  en_cours: 'status-en_cours',
  terminé: 'status-termine',
  validé: 'status-validé',
  refusé: 'status-refusé',
};

const StageCard = ({ stage }: StageCardProps) => {
  const statusClass = STATUS_CLASS[stage.statut] || 'status-invalid';

  return (
    <div className="app-card p-6 transition hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-heading mb-2">{stage.titre}</h3>
          <p className="text-sm text-muted mb-4 line-clamp-2">
            {stage.description || 'Pas de description fournie.'}
          </p>
        </div>
        <span className={`status-pill ${statusClass}`}>{STATUT_LABELS[stage.statut] || stage.statut}</span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-muted">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Entreprise</p>
          <p className="font-medium text-heading">{stage.entreprise?.nom || '-'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Début</p>
            <p>{new Date(stage.dateDebut).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Fin</p>
            <p>{new Date(stage.dateFin).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageCard;
