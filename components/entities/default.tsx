"use client";

import React from 'react';
import { Button as UIButton } from 'hasyx/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from 'hasyx/components/ui/card';
import { Badge } from 'hasyx/components/ui/badge';
import { CytoNode as CytoNodeComponent } from 'hasyx/lib/cyto';
import { X, Database } from 'lucide-react';
import { cn } from 'hasyx/lib/utils';

interface DefaultData {
  id: string;
  created_at?: string;
  updated_at?: string;
  __typename?: string;
  [key: string]: any;
}

// Helper function to extract table and schema from typename
function getEntityTypeFromTypename(typename?: string): { table: string; schema: string } {
  if (!typename) return { table: 'unknown', schema: 'public' };
  
  // Handle different typename formats
  if (typename.includes('_')) {
    const parts = typename.split('_');
    if (parts.length >= 2) {
      return { table: parts[1], schema: parts[0] };
    }
  }
  
  return { table: typename.toLowerCase(), schema: 'public' };
}

export function Button({ data, onClick, ...props }: {
  data: DefaultData | string;
  onClick?: () => void;
  [key: string]: any;
}) {
  const entityId = typeof data === 'string' ? data : data?.id;
  const entityData = typeof data === 'object' ? data : null;
  
  const { table } = entityData ? getEntityTypeFromTypename(entityData.__typename) : { table: 'unknown' };
  
  return (
    <UIButton
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("text-xs", props.className)}
      {...props}
    >
      <Database className="w-3 h-3 mr-1" />
      {table}: {entityId}
    </UIButton>
  );
}

export function CytoNode({ data, ...props }: {
  data: DefaultData | string;
  [key: string]: any;
}) {
  const entityId = typeof data === 'string' ? data : data?.id;
  const entityData = typeof data === 'object' ? data : null;
  
  const { table } = entityData ? getEntityTypeFromTypename(entityData.__typename) : { table: 'unknown' };
  
  return (
    <CytoNodeComponent
      data={{
        id: entityId,
        label: `${table}: ${entityId}`,
        entityType: table,
        ...entityData
      }}
      {...props}
    />
  );
}

export function Card({ data, onClose, ...props }: {
  data: DefaultData;
  onClose?: () => void;
  [key: string]: any;
}) {
  const entityId = typeof data === 'string' ? data : data?.id;
  const entityData = typeof data === 'object' ? data : null;
  
  if (!entityData && typeof data === 'string') {
    return (
      <UICard className="w-80" {...props}>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Entity ID: {data}
            <br />
            <span className="text-xs">No additional data available</span>
          </div>
        </CardContent>
      </UICard>
    );
  }

  const { table, schema } = getEntityTypeFromTypename(entityData?.__typename);
  
  // Separate system fields from user data
  const systemFields = ['id', 'created_at', 'updated_at', '__typename'];
  const userData = entityData ? Object.fromEntries(
    Object.entries(entityData).filter(([key]) => !systemFields.includes(key))
  ) : {};

  return (
    <UICard className="w-80" {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-full">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base capitalize">{table}</CardTitle>
              {schema !== 'public' && (
                <p className="text-sm text-muted-foreground">Schema: {schema}</p>
              )}
            </div>
          </div>
          {onClose && (
            <UIButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </UIButton>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">ID: {entityId}</Badge>
          </div>
          
          {/* Display user data */}
          {Object.entries(userData).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium capitalize">{key}:</span>{' '}
              <span className="text-muted-foreground">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
          
          {entityData?.created_at && (
            <div className="text-xs text-muted-foreground">
              Created: {new Date(entityData.created_at).toLocaleDateString()}
            </div>
          )}
          {entityData?.updated_at && (
            <div className="text-xs text-muted-foreground">
              Updated: {new Date(entityData.updated_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </UICard>
  );
} 