<?php

namespace App\Policies;

use App\Models\Addendum;
use App\Models\MedicalRecord;
use App\Models\User;

class MedicalRecordPolicy
{
    public function viewAny(User $user): bool { return in_array($user->role, ['admin', 'doctor']); }
    public function view(User $user, MedicalRecord $record): bool { return in_array($user->role, ['admin', 'doctor']); }
    public function create(User $user): bool { return in_array($user->role, ['admin', 'doctor']); }

    public function update(User $user, MedicalRecord $record): bool
    {
        return in_array($user->role, ['admin', 'doctor']) && $record->isEditable();
    }

    public function addAddendum(User $user, MedicalRecord $record): bool
    {
        return in_array($user->role, ['admin', 'doctor']);
    }

    public function updateAddendum(User $user, MedicalRecord $record, Addendum $addendum): bool
    {
        return $user->role === 'admin' || $addendum->doctor_id === $user->id;
    }

    public function deleteAddendum(User $user, MedicalRecord $record, Addendum $addendum): bool
    {
        return $user->role === 'admin' || $addendum->doctor_id === $user->id;
    }
}
