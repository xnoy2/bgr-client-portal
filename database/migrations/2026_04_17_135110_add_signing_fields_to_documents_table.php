<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->enum('sign_status', ['draft', 'pending', 'signed'])->default('pending')->after('visibility');
            $table->timestamp('sent_at')->nullable()->after('sign_status');
            $table->timestamp('signed_at')->nullable()->after('sent_at');
            $table->string('signer_name')->nullable()->after('signed_at');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['sign_status', 'sent_at', 'signed_at', 'signer_name']);
        });
    }
};
