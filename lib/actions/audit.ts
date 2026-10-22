"use server";
import {getAuditLogsAction as getAuditLogsInternal} from '@/lib/audit/internal';
export type {AuditLogEntry,AuditLogsResponse} from '@/lib/audit/internal';
export async function getAuditLogsAction(){return getAuditLogsInternal();}
