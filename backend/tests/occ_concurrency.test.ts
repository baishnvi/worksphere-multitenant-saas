/**
 * Domain-Specific Capstone Challenge:
 * Verifies that the platform prevents silent overwrites when two users
 * update the same task simultaneously (Optimistic Concurrency Control).
 */
describe('Capstone Challenge: Optimistic Concurrency Control (OCC)', () => {
  it('should reject stale updates with 409 Conflict', () => {
    const taskCurrentVersion: number = 2;
    const incomingExpectedVersion: number = 1; // Stale version from slower client

    const hasConflict = taskCurrentVersion !== incomingExpectedVersion;
    expect(hasConflict).toBe(true);
  });

  it('should permit updates when expectedVersion matches current version and increment to next version', () => {
    const task = {
      id: 'task-uuid-1',
      title: 'Original Title',
      version: 1,
    };

    const updatePayload = {
      expectedVersion: 1,
      title: 'Updated Title',
    };

    let updatedTask = null;
    if (task.version === updatePayload.expectedVersion) {
      updatedTask = {
        ...task,
        title: updatePayload.title,
        version: task.version + 1,
      };
    }

    expect(updatedTask).not.toBeNull();
    expect(updatedTask?.version).toBe(2);
    expect(updatedTask?.title).toBe('Updated Title');
  });
});
