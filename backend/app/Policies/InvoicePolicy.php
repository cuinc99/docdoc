<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool { return in_array($user->role, ['admin', 'receptionist']); }
    public function view(User $user, Invoice $invoice): bool { return in_array($user->role, ['admin', 'receptionist']); }
    public function create(User $user): bool { return in_array($user->role, ['admin', 'receptionist']); }

    public function update(User $user, Invoice $invoice): bool
    {
        return in_array($user->role, ['admin', 'receptionist']) && $invoice->status === 'pending';
    }

    public function addPayment(User $user, Invoice $invoice): bool
    {
        return in_array($user->role, ['admin', 'receptionist']) && in_array($invoice->status, ['pending', 'partial']);
    }

    public function cancel(User $user, Invoice $invoice): bool
    {
        return in_array($user->role, ['admin', 'receptionist']) && $invoice->status === 'pending';
    }
}
