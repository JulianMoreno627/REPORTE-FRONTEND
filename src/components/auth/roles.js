import { ShieldCheck, UserRound } from 'lucide-react';

export const ROLES = {
  CITIZEN: {
    icon: UserRound,
    label: 'Usuario',
    article: 'usuario',
    description: 'Reporta daños en la vía y recibe avisos de su reparación.',
  },
  OFFICIAL: {
    icon: ShieldCheck,
    label: 'Funcionario',
    article: 'funcionario',
    description: 'Gestiona incidentes y prioriza las reparaciones de la ciudad.',
  },
};
