<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agreements', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['proposal', 'variation_agreement']);
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proposal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('variation_request_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->string('title');
            $table->string('client_name');
            $table->string('project_address')->nullable();
            $table->string('contract_reference')->nullable();
            $table->json('items')->nullable();
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->text('notes')->nullable();

            $table->enum('status', ['draft', 'sent', 'signed'])->default('draft');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->text('signature_data')->nullable();
            $table->string('signed_by_name')->nullable();
            $table->string('signed_ip')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agreements');
    }
};
