import { useParams } from 'react-router-dom';

const InvestigationReportPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>Investigation Report</h1>
      <p>ID : {id}</p>
    </div>
  );
};

export default InvestigationReportPage;
