'use client'
import { useRouter } from 'next/navigation';import { useAppStore } from '@/store';export function RequireAuthAction({children}:{children:React.ReactNode}){const {profile}=useAppStore();const r=useRouter();return <span onClick={(e)=>{if(!profile){e.preventDefault();r.push('/auth/login')}}}>{children}</span>}
