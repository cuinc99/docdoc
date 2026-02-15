<?php

namespace App\Policies;

use App\Models\Queue;
use App\Models\User;

class QueuePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'receptionist']);
    }

    public function view(User $user, Queue $queue): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'receptionist']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'receptionist']);
    }

    public function call(User $user, Queue $queue): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'doctor' && $user->id === $queue->doctor_id;
    }

    public function complete(User $user, Queue $queue): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'doctor' && $user->id === $queue->doctor_id;
    }

    public function updateStatus(User $user, Queue $queue): bool
    {
        return in_array($user->role, ['admin', 'receptionist']);
    }

    public function cancel(User $user, Queue $queue): bool
    {
        return in_array($user->role, ['admin', 'receptionist']);
    }
}
