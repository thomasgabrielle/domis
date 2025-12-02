import { Beneficiary } from "@/lib/mockData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit2, Trash2, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function BeneficiaryCard({ beneficiary, onEdit, onDelete }: BeneficiaryCardProps) {
  const initials = `${beneficiary.firstName[0]}${beneficiary.lastName[0]}`;
  
  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 bg-card/50 hover:bg-card backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={beneficiary.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium font-heading">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-heading font-semibold text-lg text-foreground leading-tight">
              {beneficiary.firstName} {beneficiary.lastName}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {beneficiary.relationship}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(beneficiary.id)}>
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete?.(beneficiary.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Allocation</span>
            <span className="text-2xl font-bold font-heading text-primary">
              {beneficiary.allocation}%
            </span>
          </div>
          <div className="flex flex-col gap-1 items-end justify-end">
             <Badge 
              variant={beneficiary.status === 'Active' ? 'default' : 'secondary'}
              className={beneficiary.status === 'Active' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}
            >
              {beneficiary.status}
            </Badge>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center text-sm text-muted-foreground">
          <Mail className="h-4 w-4 mr-2" />
          {beneficiary.email}
        </div>
      </CardContent>
    </Card>
  );
}
