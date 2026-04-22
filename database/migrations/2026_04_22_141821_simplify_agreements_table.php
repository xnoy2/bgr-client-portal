<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agreements', function (Blueprint $table) {
            // Drop type and proposal_id — only variation agreements from now on
            $table->dropForeign(['proposal_id']);
            $table->dropColumn(['type', 'proposal_id']);
            // Add pdf_path for storing the generated signed PDF
            $table->string('pdf_url')->nullable()->after('signed_ip');
        });
    }

    public function down(): void
    {
        Schema::table('agreements', function (Blueprint $table) {
            $table->enum('type', ['proposal', 'variation_agreement'])->after('id');
            $table->foreignId('proposal_id')->nullable()->constrained()->nullOnDelete()->after('project_id');
            $table->dropColumn('pdf_url');
        });
    }
};
