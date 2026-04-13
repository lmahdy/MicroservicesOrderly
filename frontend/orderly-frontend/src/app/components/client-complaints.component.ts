import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div>
    <h1 class="page-title">📢 My Complaints</h1>

    <!-- CREATE COMPLAINT -->
    <div class="card">
      <h3>{{ editingId ? 'Edit Complaint' : 'Submit a Complaint' }}</h3>
      <div class="form-grid">
        <input [(ngModel)]="form.orderId" placeholder="Order ID (optional)" type="number" class="inp"/>
        <textarea [(ngModel)]="form.description" placeholder="Describe your issue *" class="inp textarea" rows="3"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn-primary" (click)="submit()" [disabled]="!form.description?.trim()">
          {{ editingId ? '✓ Save Changes' : '+ Submit Complaint' }}
        </button>
        <button class="btn-secondary" *ngIf="editingId" (click)="cancelEdit()">Cancel</button>
      </div>
      <div *ngIf="success" class="success">✅ {{success}}</div>
      <div *ngIf="error" class="error">❌ {{error}}</div>
    </div>

    <!-- LIST COMPLAINTS -->
    <div class="card">
      <div class="hdr">
        <h3>Your Complaints ({{complaints.length}})</h3>
        <button class="btn-secondary" (click)="load()">↻ Refresh</button>
      </div>
      <div *ngIf="loading" class="empty">Loading...</div>
      <div *ngIf="!loading && complaints.length === 0" class="empty">You haven't submitted any complaints yet.</div>
      <div class="table-wrap" *ngIf="complaints.length > 0">
        <table>
          <thead><tr><th>ID</th><th>Order</th><th>Description</th><th>Status</th><th>Response</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of complaints">
              <td>#{{c.id}}</td>
              <td>{{ c.orderId ? 'Order #' + c.orderId : '—' }}</td>
              <td class="desc">{{c.description}}</td>
              <td><span class="badge" [class]="c.status?.toLowerCase()">{{c.status}}</span></td>
              <td class="desc">{{c.response || '—'}}</td>
              <td>{{c.createdAt | date:'short'}}</td>
              <td class="actions">
                <button class="edit-btn" (click)="startEdit(c)" *ngIf="canModify(c)" title="Edit">✏️</button>
                <button class="del-btn" (click)="remove(c)" *ngIf="canModify(c)" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin-bottom: 24px; }
    .card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    h3 { margin: 0 0 16px; color: #333; }
    .form-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
    .inp { border: 1.5px solid #ddd; border-radius: 10px; padding: 10px 14px; font-size: 0.9rem; outline: none; font-family: inherit; }
    .inp:focus { border-color: #667eea; }
    .textarea { resize: vertical; min-height: 60px; }
    .form-actions { display: flex; gap: 10px; }
    .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; padding: 10px 20px; cursor: pointer; font-weight: 600; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: #f0f2f8; border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 0.85rem; }
    .success { color: #00a82d; margin-top: 10px; }
    .error { color: #c00; margin-top: 10px; }
    .empty { color: #aaa; font-style: italic; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f8f9ff; padding: 10px 12px; text-align: left; color: #555; }
    td { padding: 10px 12px; border-top: 1px solid #f0f0f0; vertical-align: middle; }
    .desc { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .badge.open { background: #ffe0e0; color: #c00; }
    .badge.in_progress { background: #fff7e0; color: #b07200; }
    .badge.resolved { background: #e0ffe8; color: #00a82d; }
    .badge.rejected { background: #f0f0f0; color: #666; }
    .actions { white-space: nowrap; }
    .edit-btn, .del-btn { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px 6px; border-radius: 6px; }
    .edit-btn:hover { background: #e3f0ff; }
    .del-btn:hover { background: #ffe0e0; }
  `]
})
export class ClientComplaintsComponent implements OnInit {
  complaints: any[] = [];
  form: any = { orderId: null, description: '' };
  editingId: number | null = null;
  loading = true;
  success = '';
  error = '';

  private userId = '';

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.userId = this.auth.getUserId();
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getComplaintsByClient(this.userId).subscribe({
      next: r => {
        this.complaints = r.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  submit() {
    this.success = '';
    this.error = '';
    const body = {
      orderId: this.form.orderId || null,
      clientId: this.userId,
      description: this.form.description
    };

    if (this.editingId) {
      this.api.updateComplaint(this.editingId, body).subscribe({
        next: () => { this.success = 'Complaint updated!'; this.resetForm(); this.load(); },
        error: e => this.error = e.error?.message || e.message
      });
    } else {
      this.api.createComplaint(body).subscribe({
        next: () => { this.success = 'Complaint submitted!'; this.resetForm(); this.load(); },
        error: e => this.error = e.error?.message || e.message
      });
    }
  }

  startEdit(c: any) {
    this.editingId = c.id;
    this.form = { orderId: c.orderId, description: c.description };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
  }

  remove(c: any) {
    if (!confirm('Delete this complaint?')) return;
    this.api.deleteComplaint(c.id).subscribe({
      next: () => { this.success = 'Complaint deleted.'; this.load(); setTimeout(() => this.success = '', 3000); },
      error: e => this.error = e.error?.message || e.message
    });
  }

  /** Client can only modify complaints that are still OPEN */
  canModify(c: any): boolean {
    return c.status === 'OPEN';
  }

  private resetForm() {
    this.editingId = null;
    this.form = { orderId: null, description: '' };
  }
}
