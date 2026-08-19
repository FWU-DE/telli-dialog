# Keep the vendor runtime and language toolchains, but make the network policy
# an image property rather than an undocumented environment variable.
FROM volcengine/sandbox-fusion:server-20250609@sha256:dd7ff53d16132a8acad6d5da7f15154bb4a331381567a4cb21b3e97ce581f5f9

COPY patch-upstream.sh /usr/local/bin/patch-sandbox-fusion
COPY cgroup_v2.py /root/sandbox/sandbox_cgroup_v2.py
COPY entrypoint-cgroup-v2.sh /usr/local/bin/sandbox-cgroup-v2-entrypoint
RUN chmod 0755 /usr/local/bin/sandbox-cgroup-v2-entrypoint
ENTRYPOINT ["/usr/local/bin/sandbox-cgroup-v2-entrypoint"]
CMD ["bash", "/root/sandbox/scripts/run.sh"]
RUN /usr/local/bin/patch-sandbox-fusion \
    && rm /usr/local/bin/patch-sandbox-fusion
