'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useLanguage } from '@/providers/language-provider';
import PageHeader from '@/components/ui/page-header';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [removeTarget, setRemoveTarget] = useState<any>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data } = await apiClient.get('/team');
      return data.data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => apiClient.post('/team/invite', { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setShowInvite(false);
      setInviteEmail('');
      toast.success(t.team.invited);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t.team.inviteFailed),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/team/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success(t.team.removed);
      setRemoveTarget(null);
    },
  });

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    staff: 'bg-gray-100 text-gray-700',
  };

  const roleLabels: Record<string, string> = {
    owner: t.team.owner,
    manager: t.team.manager,
    staff: t.team.staff,
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={t.team.title}
        actions={
          <button onClick={() => setShowInvite(!showInvite)} className="btn-primary gap-2 text-sm">
            <UserPlus className="w-4 h-4" /> {t.team.invite}
          </button>
        }
      />

      {showInvite && (
        <div className="card p-5">
          <div className="flex gap-3">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="input-field flex-1" placeholder={t.team.emailPlaceholder} />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input-field w-36">
              <option value="staff">{t.team.staff}</option>
              <option value="manager">{t.team.manager}</option>
            </select>
            <button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending} className="btn-primary text-sm">
              {inviteMutation.isPending ? t.team.sending : t.team.send}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.team.member}</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.team.role}</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">{t.team.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>}
            {members?.map((member: any) => (
              <tr key={member._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${roleColors[member.role] || roleColors.staff}`}>
                    {roleLabels[member.role] || member.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {member.role !== 'owner' && (
                    <button onClick={() => setRemoveTarget(member)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title={t.delete}
        message={`${t.confirmDelete} (${removeTarget?.firstName} ${removeTarget?.lastName})`}
        variant="danger"
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget._id)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
