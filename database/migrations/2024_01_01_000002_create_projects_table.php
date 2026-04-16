<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('address')->nullable();
            $table->date('start_date')->nullable();
            $table->date('estimated_completion')->nullable();
            $table->date('actual_completion')->nullable();
            $table->enum('status', ['pending', 'active', 'on_hold', 'completed', 'cancelled'])->default('pending');
            $table->string('ghl_opportunity_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
