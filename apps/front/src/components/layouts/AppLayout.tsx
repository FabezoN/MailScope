import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div>
      <nav>
        <span>MailScope</span>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
