import AppLayout from '@/components/layouts/app-layout'

// TODO: remove axios
// export const runtime = 'edge'

interface IProps {
  children: React.ReactNode
  params: { app_id: string; session_id: string }
}

export default function Layout({ children, params }: IProps) {
  const { app_id } = params

  return <AppLayout>{children}</AppLayout>
}
