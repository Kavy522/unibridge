import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Copy } from 'lucide-react'
import { hodApi } from '@/api/hod'
import { errorMessage } from '@/api/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const BRANCHES = ['IT', 'CSE', 'CE', 'AIML', 'RAI']

export function AddStudentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    enrollmentNo: '',
    name: '',
    email: '',
    branch: 'IT',
    phone: '',
    admissionYear: new Date().getFullYear(),
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => hodApi.students.create(form) as Promise<{ temporaryPassword?: string }>,
    onSuccess: (res) => {
      toast.success('Student created')
      setTempPassword(res.temporaryPassword ?? null)
      onCreated()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function close() {
    setTempPassword(null)
    setForm({ enrollmentNo: '', name: '', email: '', branch: 'IT', phone: '', admissionYear: new Date().getFullYear() })
    onClose()
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'admissionYear' ? Number(e.target.value) : e.target.value }))

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Student"
      footer={
        tempPassword ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              onClick={() => create.mutate()}
              loading={create.isPending}
              disabled={!form.enrollmentNo || !form.name || !form.email}
            >
              Create
            </Button>
          </>
        )
      }
    >
      {tempPassword ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-text-secondary">Student created. Share this temporary password:</p>
          <div className="flex items-center justify-center gap-2 rounded-sm bg-surface-2 px-4 py-3">
            <code className="text-base font-bold text-primary">{tempPassword}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success('Copied') }}
              className="text-text-muted hover:text-primary"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Enrollment No. *"><Input value={form.enrollmentNo} onChange={set('enrollmentNo')} /></Labeled>
          <Labeled label="Full Name *"><Input value={form.name} onChange={set('name')} /></Labeled>
          <Labeled label="Email *"><Input type="email" value={form.email} onChange={set('email')} /></Labeled>
          <Labeled label="Phone"><Input value={form.phone} onChange={set('phone')} /></Labeled>
          <Labeled label="Branch">
            <Select value={form.branch} onChange={set('branch')} options={BRANCHES.map((b) => ({ value: b, label: b }))} />
          </Labeled>
          <Labeled label="Admission Year">
            <Input type="number" value={form.admissionYear} onChange={set('admissionYear')} />
          </Labeled>
        </div>
      )}
    </Modal>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</label>
      {children}
    </div>
  )
}
