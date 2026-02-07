'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FaCircleCheck, 
  FaCircleXmark, 
  FaCircleInfo 
} from 'react-icons/fa6';

const iconMap = {
  success: FaCircleCheck,
  error: FaCircleXmark,
  info: FaCircleInfo
};

export default function MessageDisplay({ message, type }) {
  const Icon = iconMap[type] || FaCircleInfo;

  return (
    <Alert className="mb-6 border-2">
      <Icon className="h-4 w-4" />
      <AlertDescription className="text-sm font-medium">
        {message}
      </AlertDescription>
    </Alert>
  );
}
