<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('variation_requests', function (Blueprint $table) {
            $table->string('agreement_link')->nullable()->after('admin_notes');
            $table->enum('agreement_status', ['pending_signature', 'signed', 'declined'])->nullable()->after('agreement_link');
            $table->timestamp('agreement_signed_at')->nullable()->after('agreement_status');
        });
    }

    public function down(): void
    {
        Schema::table('variation_requests', function (Blueprint $table) {
            $table->dropColumn(['agreement_link', 'agreement_status', 'agreement_signed_at']);
        });
    }
};
