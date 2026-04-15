<?php

namespace App\Jobs\GHL;

use App\Services\GHLService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AddNoteJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public string $contactId,
        public string $body
    ) {}

    public function handle(GHLService $ghl): void
    {
        $ghl->addNote($this->contactId, $this->body);
    }
}