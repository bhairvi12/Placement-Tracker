import { toast } from 'react-hot-toast';

/**
 * Toast notifications wrapper.
 */
export const Toast = {
  success: (message) => {
    toast.success(message);
  },
  error: (message) => {
    toast.error(message);
  },
};

export default Toast;
