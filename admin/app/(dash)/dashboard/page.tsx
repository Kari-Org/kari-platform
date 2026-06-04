'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Car, Route, TrendingUp, UserCheck, Users, Wifi } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { adminApi } from '@/lib/admin-api';
import { naira } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 15_000,
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Operations overview · live" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Drivers online" value={data?.driversOnline} hint={`${data?.driversOnTrip ?? 0} on a trip`} icon={Wifi} loading={isLoading} accent />
        <StatCard label="Active trips" value={data?.activeRides} icon={Activity} loading={isLoading} />
        <StatCard label="Trips today" value={data?.ridesToday} icon={Route} loading={isLoading} />
        <StatCard label="GMV today" value={data ? naira(data.gmvToday) : undefined} icon={TrendingUp} loading={isLoading} accent />
        <StatCard label="Riders" value={data?.ridersTotal} icon={Users} loading={isLoading} />
        <StatCard label="Drivers" value={data?.driversTotal} hint={`${data?.driversOnboarded ?? 0} onboarded`} icon={Car} loading={isLoading} />
        <StatCard label="Onboarded drivers" value={data?.driversOnboarded} icon={UserCheck} loading={isLoading} />
        <StatCard label="Total trips" value={data?.ridesTotal} icon={Route} loading={isLoading} />
      </div>
    </div>
  );
}
