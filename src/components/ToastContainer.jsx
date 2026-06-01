import { useData } from '../contexts/DataContext';
import { X, IndianRupee, UserPlus, Bell } from 'lucide-react';

const ICONS = {
  expense: <IndianRupee size={13} />,
  join:    <UserPlus   size={13} />,
  default: <Bell       size={13} />,
};

export default function ToastContainer() {
  const data = useData();
  // Render nothing if DataProvider is not mounted yet (e.g. policy gate)
  if (!data || !data.toasts.length) return null;
  const { toasts, removeToast } = data;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          <div className="toast-icon">{ICONS[toast.type] || ICONS.default}</div>
          <p className="toast-message">{toast.message}</p>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
