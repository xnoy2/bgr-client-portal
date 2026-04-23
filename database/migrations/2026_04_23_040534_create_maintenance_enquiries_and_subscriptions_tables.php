<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_enquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->enum('plan', ['essential', 'premium', 'elite']);
            $table->text('message')->nullable();
            $table->enum('status', ['pending', 'reviewed', 'converted'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('maintenance_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->enum('plan', ['essential', 'premium', 'elite']);
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');
            $table->date('start_date')->nullable();
            $table->date('renewal_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_subscriptions');
        Schema::dropIfExists('maintenance_enquiries');
    }
};
