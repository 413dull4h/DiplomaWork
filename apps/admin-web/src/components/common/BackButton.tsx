import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
export function BackButton() { const navigate = useNavigate(); const { t } = useTranslation(); return <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} />{t('common.back')}</Button> }
