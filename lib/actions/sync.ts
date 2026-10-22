"use server";
import * as engine from '@/lib/uams/sync-engine';
import type {RegisterStudentInput} from '@/lib/validations/sync';
export type {SyncCounts,UamsSyncResponse,SyncRunRecord,LatestSyncStatus,RegisterStudentResponse} from '@/lib/uams/sync-engine';
export async function syncUamsDataAction(payload:unknown){return engine.syncUamsDataAction(payload);}
export async function getLatestSyncStatusAction(){return engine.getLatestSyncStatusAction();}
export async function getSyncRunsHistoryAction(){return engine.getSyncRunsHistoryAction();}
export async function registerStudentAction(input:RegisterStudentInput){return engine.registerStudentAction(input);}
export async function deleteStudentForCleanupAction(email:string){return engine.deleteStudentForCleanupAction(email);}
