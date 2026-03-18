import toast from 'react-hot-toast';

export const notifySuccess = (message: string = 'Operation completed successfully!') =>
    toast.success(message);

export const notifyError = (message: string = 'Something went wrong!') =>
    toast.error(message);

export const notifyLoading = (message: string = 'Processing...') =>
    toast.loading(message);