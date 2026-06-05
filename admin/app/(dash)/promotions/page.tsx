import { Gift, Tag } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PromotionsPage() {
  return (
    <div>
      <PageHeader title="Promotions" subtitle="Rider & driver incentives" />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Active programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Gift size={16} className="mt-0.5 text-brand" />
            <div>
              <p className="text-white">Referral rewards</p>
              <p className="text-subtle">
                Riders and drivers earn a wallet credit when an invitee completes their first ride. Managed
                by the engagement service; rates are part of the fare configuration.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Tag size={16} className="mt-0.5 text-brand" />
            <div>
              <p className="text-white">Leaderboard commission relief</p>
              <p className="text-subtle">
                Top weekly drivers receive a temporary commission reduction — an automatic, performance-based
                incentive.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-card border border-dashed border-hairline p-8 text-center text-sm text-subtle">
        Campaign management — promo codes, time-boxed discounts and surge caps — lands with the dedicated
        promotions engine. The programs above are live today.
      </div>
    </div>
  );
}
