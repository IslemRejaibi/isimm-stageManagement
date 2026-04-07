interface StageCardProps {
  stage: {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    company: string;
  };
}

const StageCard = ({ stage }: StageCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {stage.title}
      </h3>
      <p className="text-gray-600 mb-4 line-clamp-2">
        {stage.description}
      </p>
      <div className="mb-4">
        <p className="text-sm text-gray-500">Entreprise</p>
        <p className="text-lg font-semibold text-gray-900">
          {stage.company}
        </p>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{new Date(stage.startDate).toLocaleDateString('fr-FR')}</span>
        <span>{new Date(stage.endDate).toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  );
};

export default StageCard;
