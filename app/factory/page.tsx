// app/factory/page.tsx
import { IndexCreator } from './components/IndexCreator';

export const metadata = {
  title: 'Create Index | Your App Name',
  description: 'Create your custom index token',
};

const validateEnvironmentVariables = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SET_TOKEN_CREATOR',
    'NEXT_PUBLIC_BASIC_ISSUANCE_MODULE',
    'NEXT_PUBLIC_STREAMING_FEE_MODULE',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing environment variable: ${varName}`);
    }
  }
};

export default function FactoryPage() {
  validateEnvironmentVariables();

  return <IndexCreator />;
}
